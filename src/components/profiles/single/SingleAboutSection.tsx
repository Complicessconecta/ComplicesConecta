import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export interface SingleMemberDetails {
  height?: string | null;
  weight?: string | null;
  hair?: string | null;
  eyes?: string | null;
  orientation?: string | null;
  smoker?: string | null;
  zodiac?: string | null;
}

export interface SingleAboutMember {
  name: string;
  age: number | null;
  gender: string;
  bio?: string | null | undefined;
  avatarGradient: string;
  details: SingleMemberDetails;
}

interface SingleAboutSectionProps {
  member: SingleAboutMember;
  isDemoMode?: boolean;
}

/**
 * "Sobre mí": un bloque para 1 usuario (espejo de CoupleAboutSection,
 * modelo del video). Solo se muestran los detalles que existen en el
 * modelo; los campos vacíos se ocultan, nunca se inventan. En demo los
 * campos físicos usan valores de demostración que pasa el padre (no son
 * datos reales de nadie).
 */
export const SingleAboutSection: React.FC<SingleAboutSectionProps> = ({
  member,
  isDemoMode = false,
}) => {
  const rows: Array<[string, string]> = [
    ["Altura", member.details.height ?? ""],
    ["Peso", member.details.weight ?? ""],
    ["Cabello", member.details.hair ?? ""],
    ["Ojos", member.details.eyes ?? ""],
    ["Orientación", member.details.orientation ?? ""],
    ["Fumador", member.details.smoker ?? ""],
    ["Zodiaco", member.details.zodiac ?? ""],
  ].filter(([, value]) => value.trim().length > 0) as Array<[string, string]>;

  return (
    <Card className="bg-white dark:bg-white/10 backdrop-blur-md border-slate-200 dark:border-white/20 text-slate-900 dark:text-white">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-fuchsia-400" />
          Sobre mí
          {isDemoMode && (
            <Badge className="bg-yellow-500/20 text-yellow-800 border-yellow-500/40 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-400/30 text-xs">
              DEMO
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-slate-900/5 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-14 h-14 rounded-full bg-linear-to-br ${member.avatarGradient} flex items-center justify-center text-white text-xl font-bold shrink-0`}
            >
              {member.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{member.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {typeof member.age === "number" && (
                  <Badge className="profile-badge badge-age">
                    🎂 {member.age} años
                  </Badge>
                )}
                {(member.gender === "female" || member.gender === "male") && (
                  <Badge className="profile-badge badge-gender">
                    {member.gender === "female" ? "♀️" : "♂️"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {member.bio && (
            <p className="text-sm text-slate-600 dark:text-white/80 mb-3">{member.bio}</p>
          )}

          {rows.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500 dark:text-white/50">{label}</dt>
                  <dd className="text-slate-900 dark:text-white font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-xs text-slate-500 dark:text-white/50">
              Sin detalles adicionales por ahora.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SingleAboutSection;
